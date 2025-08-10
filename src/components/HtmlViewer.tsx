"use client";

interface HtmlViewerProps {
    content: string;
    className?: string;
}

export default function HtmlViewer({ content, className }: HtmlViewerProps) {
    return (
        <div 
            className={`html-viewer prose prose-sm max-w-none text-gray-900 ${className}`}
            style={{ 
                overflowX: 'auto',
            }}
            dangerouslySetInnerHTML={{
                __html: content || '<p class="text-gray-500">No description available</p>'
            }}
        />
    );
}