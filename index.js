const path = require("path");
const fs = require('fs');
const pdf = require('pdf-parse');

/**
[
  {
    title: "Vintage Basic T-Shrit Mix",
    price: "$12"
  },
  {
    title: "Vintage Basic T-Shrit Mix",
    price: null,
    misc: "Price on Request"
  },
]
*/

async function parsePdfToStock(pathToFile) {
  let dataBuffer = fs.readFileSync(pathToFile);

  const data = await pdf(dataBuffer);

  const splitByLine = data.text.split("\n").filter(Boolean).map(x => x.trim());

  const result = [];

  let tableIndex = -1;
  for (let index = 0; index < splitByLine.length; index++) {
    const line = splitByLine[index];
    const nextLine = splitByLine[index + 1];

    if (line === 'Price (per' && nextLine === 'item)') {
      tableIndex = index + 2;
    }

    /**
      'Vintage Professional Sport Sweatshirt Mix$12.5',
      instead

      'Vintage Professional'
      'Sport Sweatshirt Mix$12.5',


      '$5 Vintage Professional Sport Sweatshirt Mix$12.5',
    */

    // `line` contains the first line item
    if (tableIndex !== -1 && index >= tableIndex) {
      // line is "some title$123"
      if (line.includes("$")) {
        const [title, price] = line.split("$");
        result.push({ title, price: `$${price}`, misc: null });
      } else {
        if (['Price on request'].includes(line)) {
          continue;
        }
        // line is "some title" nextLine is "Price on request"
        result.push({ title: line, price: null, misc: nextLine });
      }
    }
  }
  // PDF text
  //console.log(splitByLine);
  //console.log(result);
  return result;
}

function testParseResult(result) {
  return JSON.stringify(result.every((x, index) => {
    if (!(x.price === null || x.price.includes("$"))) {
      throw new Error(`Parse Error in item ${index} "${x.price}".\nPrice is not $ or null"`);
    }
    if (!(x.misc === null || ['Price on request'].includes(x.misc))) {
      throw new Error(`Parse Error in item ${index} "${x.misc}".\nMisc is not null or "Price on Request"`);
    }
    if (["$", "Price on request"].some(y => x.title.includes(y))) {
      throw new Error(`Parse Error in item ${index} "${x.title}".\nTitle has $ or "Price on Request"`);
    }
    return true;
  }));
}

//;

(async () => {
  const result = await parsePdfToStock("stock-lists.pdf");

  console.log(testParseResult(result))
  console.log(result);
})();
