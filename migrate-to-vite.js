const fs = require('fs');
const path = require('path');

// 1. Move globals.css
fs.copyFileSync('app/globals.css', 'src/index.css');

// 2. Process all .jsx files in src
function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            processDir(filePath);
        } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            // Remove "use client"
            if (content.includes('"use client"')) {
                content = content.replace(/"use client";?\n?/g, '');
                content = content.replace(/'use client';?\n?/g, '');
                modified = true;
            }

            // Replace next/navigation
            if (content.includes('next/navigation')) {
                content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]next\/navigation['"];?/g, (match, p1) => {
                    let imports = [];
                    if (p1.includes('useRouter')) imports.push('useNavigate');
                    if (p1.includes('usePathname')) imports.push('useLocation');
                    return `import { ${imports.join(', ')} } from 'react-router-dom';`;
                });
                // Replace useRouter() with useNavigate()
                content = content.replace(/useRouter\(\)/g, 'useNavigate()');
                // Replace usePathname() with useLocation().pathname
                content = content.replace(/usePathname\(\)/g, 'useLocation().pathname');
                modified = true;
            }

            // Replace next/link
            if (content.includes('next/link')) {
                content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"];?/g, "import { Link } from 'react-router-dom';");
                modified = true;
            }
            
            // Replace next/image
            if (content.includes('next/image')) {
                content = content.replace(/import\s+Image\s+from\s+['"]next\/image['"];?/g, "");
                content = content.replace(/<Image/g, '<img');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    }
}

processDir('src');

// 3. Delete Next.js files
fs.rmSync('.next', { recursive: true, force: true });
fs.rmSync('app', { recursive: true, force: true });
if (fs.existsSync('next.config.mjs')) fs.rmSync('next.config.mjs');
if (fs.existsSync('fix.js')) fs.rmSync('fix.js');
if (fs.existsSync('rename.js')) fs.rmSync('rename.js');
if (fs.existsSync('copy-rename.js')) fs.rmSync('copy-rename.js');

console.log('Migration complete');
