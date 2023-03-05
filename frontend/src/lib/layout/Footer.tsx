import { Flex, Link, Text } from "@chakra-ui/react";
import Rate from "./Rate";
import Session from "./Session";
const Footer = () => {
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
        {/*<Button onClick={endSession}>end session</Button>*/}
      </Text>
    </Flex>
  );
};

export default Footer;
