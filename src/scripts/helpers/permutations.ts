/**
 * Creates a list of all possible permutations of a list of lists.
 * @param list The list to permute over.
 */
export function createPermutations(list: any[][]): any[][] {
  let output: any[][] = [[]];
  for (let currentSublist of list) {
    let newOutput = [];
    for (let sublistObject of currentSublist) {
      for (var o of output) {
        var newList = o.slice();
        newList.push(sublistObject)
        newOutput.push(newList);
      }
    }
    output = newOutput;
  }
  return output;
}