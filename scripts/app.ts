(async () => {
  console.log('hello world');
  // eslint-disable-next-line no-undef
  process.exit();
})().catch((err) => {
  console.log(`err caught at ${err}`);
  // eslint-disable-next-line no-undef
  process.exit(1);
});
