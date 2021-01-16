for (let i in self) {
  if (i.startsWith('on')) self[i] = console.log;
}
