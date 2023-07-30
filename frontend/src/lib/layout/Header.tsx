import { Box, Flex, Icon } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import ThemeToggle from "./ThemeToggle";
// Import the appropriate Chakra UI Icon components here
// For example, if you have CheckCircleIcon and WarningIcon:
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";

const Header = () => {
  const [keepkeyError, setKeepKeyError] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [terminalName, setTerminalName] = useState(false);
  const [isCheckingOnline, setIsCheckingOnline] = useState(false);
  const getStatus = async function () {
    try {
      console.log("Header:  getStatus");
      const status = await axios.get(
          "http://localhost:4000/api/v1/" + "status"
      );
      console.log("getStatus status: ", status.data);
      if (status.data.terminalName) {
        setTerminalName(status.data.terminalName);
        setIsOnline(true);
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setIsOnline(false);
    }
  };

  const onStart = async function () {
    try {
      console.log("onStart Running");
      getStatus();
      setInterval(getStatus, 30000);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setKeepKeyError("Bridge is offline!");
    }
  };

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
          {isOnline ? (
              <>
                {/* Use the appropriate Chakra UI Icon component for the online state */}
                {/* For example, if using CheckCircleIcon: */}
                <div><small>{terminalName}</small></div>
                 <Icon as={CheckCircleIcon} boxSize={6} color="green.500" />
              </>
          ) : (
              <>
                {/* Use the appropriate Chakra UI Icon component for the offline state */}
                {/* For example, if using WarningIcon: */}
                {/* <Icon as={WarningIcon} boxSize={6} color="red.500" /> */}
                <div>offline!</div>
              </>
          )}
        </Box>
      </Flex>
  );
};

export default Header;
