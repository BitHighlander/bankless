import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [keepkeyError, setKeepKeyError] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isCheckingOnline, setIsCheckingOnline] = useState(false);
  const getBalance = async function () {
    try {

      const status = await axios.get(
          "http://localhost:4000/api/v1/" + "balance"
      );
      console.log("balance: ", status.data);
      if(status.data){
        setIsOnline(true)
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setIsOnline(false)
    }
  };

  const onStart = async function () {
    try {
      console.log("onStart Running")
      // if(!isCheckingOnline){
      //   setIsCheckingOnline(true)
      //   setInterval(getBalance, 45000)
      // }
      setInterval(getBalance, 45000)
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
        {isOnline ? (<div>online</div>) : (<div>offline!</div>)}
        {/*<div>*/}
        {/*  /!* {features && <div>features: {features}</div>} *!/*/}
        {/*  {keepkeyError && <div>error: {keepkeyError}</div>}*/}
        {/*</div>*/}
        <ThemeToggle />
      </Box>
    </Flex>
  );
};

export default Header;
