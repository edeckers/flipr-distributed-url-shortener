export const validator = (
  reserved: Set<string>,
  offensive: Set<string>,
  protected_: Set<string>,
) => {
  const blockListed = new Set([...reserved, ...offensive, ...protected_]);

  return (code: string): boolean => {
    const lowerCode = code.toLowerCase();

    if (!/^[a-zA-Z0-9-_]{3,10}$/.test(code)) return false;

    return (
      !blockListed.has(lowerCode) &&
      !blockListed.has(lowerCode.replace(/[-_]/g, ''))
    );
  };
};
