export const getExtFromFile = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    const rawFilename =
        lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;
    const extension =
        lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : '';

    return {rawFilename, extension};
};
