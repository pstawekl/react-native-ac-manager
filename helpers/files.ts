const getFileName = (filePath: string) => {
  const parsedUrl = filePath.split('/');
  return parsedUrl[parsedUrl.length - 1];
};

export default getFileName;
