#!/usr/bin/env node

/**
 * Script to install git hooks for the project
 * This ensures all team members get the proper hooks when setting up the project
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HOOKS_DIR = path.join(__dirname, "..", ".git", "hooks");
const HOOKS_SOURCE_DIR = path.join(__dirname, "..", "devops", "git-hooks");

function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyHook(hookName, sourceFile) {
    const hookPath = path.join(HOOKS_DIR, hookName);
    const sourcePath = path.join(HOOKS_SOURCE_DIR, sourceFile);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, hookPath);
        fs.chmodSync(hookPath, "755");
        console.log(`✅ Installed ${hookName} hook`);
        return true;
    } else {
        console.log(`⚠️  Source file for ${hookName} not found: ${sourcePath}`);
        return false;
    }
}

function installHooks() {
    console.log("🔧 Installing git hooks...");

    // Ensure hooks directory exists
    ensureDirectoryExists(HOOKS_DIR);

    // Check if we're in a git repository
    try {
        execSync("git rev-parse --git-dir", { stdio: "ignore" });
    } catch (error) {
        console.log("⚠️  Not in a git repository, skipping hook installation");
        return;
    }

    // Install hooks
    const hooks = [
        { name: "pre-commit", file: "pre-commit" },
        { name: "pre-push", file: "pre-push" },
    ];

    let installedCount = 0;

    for (const hook of hooks) {
        if (copyHook(hook.name, hook.file)) {
            installedCount++;
        }
    }

    if (installedCount > 0) {
        console.log(
            `\n🎉 Successfully installed ${installedCount} git hook(s)`
        );
        console.log("\n📋 Available hooks:");
        console.log("  • pre-commit: Prevents .env files from being committed");
        console.log("  • pre-push: Manual .env encryption check");
    } else {
        console.log("❌ No hooks were installed");
    }
}

if (require.main === module) {
    installHooks();
}

module.exports = { installHooks };
