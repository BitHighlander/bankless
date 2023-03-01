import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [keepkeyError, setKeepKeyError] = useState(false);

  const onStart = async function () {
    try {
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setKeepKeyError("Bridge is offline!");
    }
  };

  // onStart()
  useEffect(() => {
    onStart();
  }, []); // once on startup

  return (
    <Flex
      as="header"
      width="full"
      align="center"
      alignSelf="flex-start"
      justifyContent="center"
      gridGap={2}
    >
      <Box marginLeft="auto">
        <div>
          {/* {features && <div>features: {features}</div>} */}
          {keepkeyError && <div>error: {keepkeyError}</div>}
        </div>
        <ThemeToggle />
      </Box>
    </Flex>
  );
};

export default Header;
