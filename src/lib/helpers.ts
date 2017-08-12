export function getLongestString(strings: string[]): string {
  return strings.reduce((prev, current) => current.length > prev.length ? current : prev, "");
}

export function shuffleArray(array: any[]) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}