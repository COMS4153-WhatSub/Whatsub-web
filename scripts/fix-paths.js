const fs = require('fs');
const path = require('path');

function fixPaths(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixPaths(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Fix _next paths to be relative
            content = content.replace(/["']\/_next\//g, '"./_next/');
            content = content.replace(/["']\/_next\//g, "'./_next/");
            fs.writeFileSync(filePath, content);
        }
    });
}

fixPaths(path.join(__dirname, '../out'));
