import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir('./src');
files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace text color
    content = content.replace(/text-\[#0D1B4B\]/g, 'text-[#F5C518]');
    // Replace borders and rings
    content = content.replace(/border-\[#0D1B4B\]/g, 'border-[#F5C518]');
    content = content.replace(/ring-\[#0D1B4B\]/g, 'ring-[#F5C518]');
    // Replace backgrounds and handle text color for buttons if needed
    // First, just replace bg-[#0D1B4B] with bg-[#F5C518] text-black
    // Wait, replacing 'bg-[#0D1B4B]' -> 'bg-[#F5C518] text-black' might duplicate text-black if run twice, it's fine for one run
    content = content.replace(/bg-\[#0D1B4B\]/g, 'bg-[#F5C518] text-black');
    content = content.replace(/hover:bg-\[#0D1B4B\]\/90/g, 'hover:bg-[#F5C518]/90');
    // Also "text-black" might be injected next to an existing text-white or something, but it's simpler.
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
