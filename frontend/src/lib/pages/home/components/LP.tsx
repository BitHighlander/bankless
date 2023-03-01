import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";

const LP = () => {
  const [sessionInit, setSessionInit] = React.useState(false);
  // const [sessionInit, setSessionInit] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const handleInputChangeAddress = (e: any) => setAddress(e.target.value);

  const onSubmit = async function () {
    try {

      setSessionInit(true);
      const body = {
        address,
      };

      const submitResp = await axios.post(
        "http://localhost:4000/api/v1/create/lp",
        body
      );
      // eslint-disable-next-line no-console
      console.log("submitResp: ", submitResp);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onCheckDollars = async function () {
    try {
      // eslint-disable-next-line no-console
      console.log("onCheckDollars: ");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onDone = async function () {
    try {
      // eslint-disable-next-line no-console
      console.log("onDone: ");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onStart = async function () {
    try {
      //
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  // onstart get data
  useEffect(() => {
    onStart();
  }, []);

  const isError = false;

  return (
    <Grid textAlign="center" gap={2}>
      Provide LP to device. buy LP tokens OnRamp to LUSD
      {sessionInit ? (
        <div>
          session {} (awaiting deposit....)
          <Button
            mt={4}
            colorScheme="teal"
            // isLoading={props.isSubmitting}
            type="submit"
            onClick={onCheckDollars}
          >
            update
          </Button>
          <Button
            mt={4}
            colorScheme="teal"
            // isLoading={props.isSubmitting}
            type="submit"
            onClick={onDone}
          >
            Done
          </Button>
        </div>
      ) : (
        <div>
          <FormControl isInvalid={isError}>
            <FormLabel>Address</FormLabel>
            <Input
              type="email"
              value={address}
              onChange={handleInputChangeAddress}
            />
            {!isError ? (
              <FormHelperText>Enter your address</FormHelperText>
            ) : (
              <FormErrorMessage>address is required.</FormErrorMessage>
            )}
            <Button
              mt={4}
              colorScheme="teal"
              // isLoading={props.isSubmitting}
              type="submit"
              onClick={onSubmit}
            >
              Continue
            </Button>
          </FormControl>
        </div>
      )}
    </Grid>
  );
};

export default LP;
