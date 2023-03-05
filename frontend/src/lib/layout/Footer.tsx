import { Flex, Link, Text, Button } from "@chakra-ui/react";
import Rate from "./Rate";
import Session from "./Session";
import axios from "axios";

const Footer = () => {

  const clearSession = async function () {
    try {
      // eslint-disable-next-line no-console
      console.log("onDone: ");

      //fullfill
      const body = {
        sessionId:"test"
      };
      let submitResp = await axios.post(
          "http://127.0.0.1:4000/api/v1/clear",
          body
      );
      submitResp = submitResp.data
      // eslint-disable-next-line no-console
      console.log("submitResp: ", submitResp);
      window.location.reload();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };


  return (
    <Flex
      as="footer"
      width="full"
      align="center"
      alignSelf="flex-end"
      justifyContent="center"
    >
      <Text fontSize="xl">
        <Rate />
        {/*<br/>*/}
        {/*<Session />*/}
        <Button onClick={clearSession}>end session</Button>
      </Text>
    </Flex>
  );
};

export default Footer;
