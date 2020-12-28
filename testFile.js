const moment = require('moment');

function checkItem(i){
  if( i === 'b' ){
   throw new Error('error');
  } else {
    return true;
  }
}

async function test() {
  const inputArray = ['a', 'b', 'c', 'd'];
  const successItems = [];
  const failedItems = [];

  for await (item of inputArray ){
    try {
      results = checkItem(item);
      successItems.push(item);
    } catch (error) {
      failedItems.push(item);
    }
  }

  console.log(successItems, failedItems);
}

test()
