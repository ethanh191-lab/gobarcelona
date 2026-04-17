const fs = require('fs');
let c = fs.readFileSync('app/map/page.tsx', 'utf8');

// 1. Update filteredPlaces dependencies to include selectedNb
c = c.replace(
  /\}, \[places, priceRange, maxDistance, filters, userLoc\]\);/,
  '}, [places, priceRange, maxDistance, filters, userLoc, selectedNb]);'
);

// 2. Update filteredPlaces logic
const oldFilter = /return places\.filter\(p => \{\s*if \(p\.status === 'permanently_closed'/;
const newFilter = `return places.filter(p => {
      if (selectedNb !== 'all') {
        const nb = NEIGHBOURHOODS.find(n => n.id === selectedNb);
        if (nb && p.neighbourhood !== nb.name) return false;
      }
      if (p.status === 'permanently_closed'`;

if (oldFilter.test(c)) {
  c = c.replace(oldFilter, newFilter);
  console.log('Filter updated');
} else {
  console.log('Filter regex NOT found');
}

fs.writeFileSync('app/map/page.tsx', c);
console.log('Done!');
