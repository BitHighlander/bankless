import { Flex, Link, Text, Button } from "@chakra-ui/react";
import Rate from "./Rate";
import Session from "./Session";
import axios from "axios";

const Footer = () => {

  return (
    <Flex
      as="footer"
      width="full"
      align="center"
      justifyContent="center"
    >
      <Text fontSize="xl">
        <Rate />
      </Text>
    </Flex>
  );
};

export default Footer;
