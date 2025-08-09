#!/usr/bin/env node

/**
 * Script to encrypt/decrypt .env files with password protection
 *
 * Usage:
 *   node scripts/encrypt-env.js encrypt .env .env.encrypted
 *   node scripts/encrypt-env.js decrypt .env.encrypted .env
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha512");
}

function encrypt(text, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(password, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(salt);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    return (
        salt.toString("hex") +
        iv.toString("hex") +
        tag.toString("hex") +
        encrypted
    );
}

function decrypt(encryptedData, password) {
    const salt = Buffer.from(encryptedData.slice(0, SALT_LENGTH * 2), "hex");
    const iv = Buffer.from(
        encryptedData.slice(SALT_LENGTH * 2, SALT_LENGTH * 2 + IV_LENGTH * 2),
        "hex"
    );
    const tag = Buffer.from(
        encryptedData.slice(
            SALT_LENGTH * 2 + IV_LENGTH * 2,
            SALT_LENGTH * 2 + IV_LENGTH * 2 + TAG_LENGTH * 2
        ),
        "hex"
    );
    const encrypted = encryptedData.slice(
        SALT_LENGTH * 2 + IV_LENGTH * 2 + TAG_LENGTH * 2
    );

    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    decipher.setAAD(salt);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

function promptPassword(message) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(message, (password) => {
            rl.close();
            resolve(password);
        });
    });
}

function getPassword() {
    // First try to get password from environment variable
    const envPassword = process.env.ENV_ENCRYPTION_PASSWORD;
    if (envPassword) {
        return Promise.resolve(envPassword);
    }

    // If not found, try to load from .env.local file
    const passwordFromFile = loadPasswordFromFile();
    if (passwordFromFile) {
        return Promise.resolve(passwordFromFile);
    }

    // If not found, try to set up password automatically
    return setupPasswordIfNeeded();
}

function loadPasswordFromFile() {
    const envPasswordPath = path.join(__dirname, "..", ".env.password");

    if (!fs.existsSync(envPasswordPath)) {
        return null;
    }

    try {
        const envContent = fs.readFileSync(envPasswordPath, "utf8");
        const match = envContent.match(/ENV_ENCRYPTION_PASSWORD=(.+)/);

        if (match && match[1]) {
            // Load it into environment for future use
            process.env.ENV_ENCRYPTION_PASSWORD = match[1];
            return match[1];
        }
    } catch (error) {
        console.log("⚠️  Could not read .env.password file:", error.message);
    }

    return null;
}

async function setupPasswordIfNeeded() {
    console.log("🔐 No encryption password found in environment");
    console.log("Setting up password automatically...");

    // Check if .env.password already exists and has a password
    const envPasswordPath = path.join(__dirname, "..", ".env.password");
    if (fs.existsSync(envPasswordPath)) {
        try {
            const envContent = fs.readFileSync(envPasswordPath, "utf8");
            const match = envContent.match(/ENV_ENCRYPTION_PASSWORD=(.+)/);

            if (match && match[1]) {
                console.log("✅ Found existing password in .env.password");
                process.env.ENV_ENCRYPTION_PASSWORD = match[1];
                return match[1];
            }
        } catch (error) {
            console.log("⚠️  Could not read existing .env.password file");
        }
    }

    // Get password from user
    const password = await promptPassword("Enter your encryption password: ");
    if (!password) {
        console.error("❌ Password cannot be empty");
        process.exit(1);
    }

    // Confirm password
    const confirmPassword = await promptPassword(
        "Confirm your encryption password: "
    );
    if (password !== confirmPassword) {
        console.error("❌ Passwords do not match");
        process.exit(1);
    }

    // Create .env.password file
    const envContent = `# Environment password for .env encryption
# This file should be in your .gitignore
ENV_ENCRYPTION_PASSWORD=${password}
`;

    try {
        fs.writeFileSync(envPasswordPath, envContent);
        console.log("✅ Password saved to .env.password");

        // Load the environment variable for current session
        process.env.ENV_ENCRYPTION_PASSWORD = password;

        console.log("✅ Password loaded for current session");
        console.log("");
        console.log("💡 Commands that will now work without password prompts:");
        console.log("  npm run encrypt");
        console.log("  npm run decrypt");

        return password;
    } catch (error) {
        console.error("❌ Error saving password:", error.message);
        process.exit(1);
    }
}

async function getPasswordForDecryption(inputData) {
    // First try to get password from environment variable
    const envPassword = process.env.ENV_ENCRYPTION_PASSWORD;
    if (envPassword) {
        try {
            decrypt(inputData, envPassword);
            return envPassword; // Password works
        } catch (error) {
            console.log(
                "⚠️  Environment password failed, trying file password..."
            );
        }
    }

    // If not found or failed, try to load from .env.password file
    const passwordFromFile = loadPasswordFromFile();
    if (passwordFromFile) {
        try {
            decrypt(inputData, passwordFromFile);
            return passwordFromFile; // Password works
        } catch (error) {
            console.log(
                "⚠️  Stored password failed, prompting for new password..."
            );
        }
    }

    // If stored password failed or doesn't exist, prompt for password
    while (true) {
        const password = await promptPassword(
            "Enter your encryption password: "
        );
        if (!password) {
            console.error("❌ Password cannot be empty");
            process.exit(1);
        }

        try {
            decrypt(inputData, password);
            // Password works! Save it for future use
            const envPasswordPath = path.join(__dirname, "..", ".env.password");
            const envContent = `# Environment password for .env encryption
# This file should be in your .gitignore
ENV_ENCRYPTION_PASSWORD=${password}
`;
            try {
                fs.writeFileSync(envPasswordPath, envContent);
                console.log("✅ Password verified and saved to .env.password");
                process.env.ENV_ENCRYPTION_PASSWORD = password;
            } catch (error) {
                console.log(
                    "⚠️  Could not save password to file, but continuing with decryption..."
                );
            }
            return password;
        } catch (error) {
            console.error("❌ Wrong password! Please try again.");
        }
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error(
            "Usage: node devops/encrypt-env.js <encrypt|decrypt> <env-file> [output-file]"
        );
        console.error("");
        console.error("Examples:");
        console.error("  node scripts/encrypt-env.js encrypt .env");
        console.error("  node scripts/encrypt-env.js encrypt .env.production");
        console.error("  node scripts/encrypt-env.js decrypt .env.encrypted");
        console.error(
            "  node scripts/encrypt-env.js decrypt .env.production.encrypted"
        );
        console.error("");
        console.error("Or with custom output:");
        console.error(
            "  node scripts/encrypt-env.js encrypt .env .env.encrypted"
        );
        console.error(
            "  node scripts/encrypt-env.js decrypt .env.encrypted .env"
        );
        process.exit(1);
    }

    const [action, inputFile] = args;
    let outputFile = args[2]; // Optional output file

    if (!["encrypt", "decrypt"].includes(action)) {
        console.error('Action must be either "encrypt" or "decrypt"');
        process.exit(1);
    }

    if (!fs.existsSync(inputFile)) {
        console.error(`Input file "${inputFile}" does not exist`);
        process.exit(1);
    }

    // Auto-generate output filename if not provided
    if (!outputFile) {
        if (action === "encrypt") {
            outputFile = inputFile + ".encrypted";
        } else {
            // For decrypt, remove .encrypted extension
            if (inputFile.endsWith(".encrypted")) {
                outputFile = inputFile.slice(0, -10); // Remove '.encrypted'
            } else {
                outputFile = inputFile;
            }
        }
    }

    try {
        const inputData = fs.readFileSync(inputFile, "utf8");
        let password;

        if (action === "encrypt") {
            password = await getPassword();
            if (!password) {
                console.error("Password cannot be empty");
                process.exit(1);
            }
        } else {
            // For decryption, use the new function that tests password before storing
            password = await getPasswordForDecryption(inputData);
        }

        let outputData;

        if (action === "encrypt") {
            outputData = encrypt(inputData, password);
            console.log(
                `✅ File encrypted successfully: ${inputFile} -> ${outputFile}`
            );
        } else {
            // We already tested the password in getPasswordForDecryption, so this should work
            outputData = decrypt(inputData, password);
            console.log(
                `✅ File decrypted successfully: ${inputFile} -> ${outputFile}`
            );
        }

        fs.writeFileSync(outputFile, outputData);
        console.log(`📁 Output saved to: ${outputFile}`);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
