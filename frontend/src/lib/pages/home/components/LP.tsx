import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  Tabs, TabList, TabPanels, Tab, TabPanel
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";

const LP = () => {
  const [sessionInit, setSessionInit] = React.useState(false);
  // const [sessionInit, setSessionInit] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const handleInputChangeAddress = (e: any) => setAddress(e.target.value);

  const onSubmitSync = async function () {
    try {

      setSessionInit(true);
      const body = {
        address,
        type:"sync"
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

  const onSubmitAsync = async function () {
    try {

      setSessionInit(true);
      const body = {
        address,
        type:"async"
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

  const onDoneAsync = async function () {
    try {
      // eslint-disable-next-line no-console
      console.log("onDone: ");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onDoneSync = async function () {
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
      Provide LP to device.
      <Tabs>
        <TabList>
          <Tab>Sync</Tab>
          <Tab>Async</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <p>You will deposit DAI and USD and will receive LP tokens (offchain)</p>
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
                      onClick={onDoneSync}
                  >
                    Done
                  </Button>
                </div>
            ) : (
                <div>
                  <FormControl isInvalid={isError}>
                    <FormLabel>Address (ETH)</FormLabel>
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
                        onClick={onSubmitSync}
                    >
                      Continue
                    </Button>
                  </FormControl>
                </div>
            )}
          </TabPanel>
          <TabPanel>
            <p>You will deposit DAI OR USD and will receive LP tokens (offchain)</p>
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
                      onClick={onDoneAsync}
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
                        onClick={onSubmitAsync}
                    >
                      Continue
                    </Button>
                  </FormControl>
                </div>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      <br/>
    </Grid>
  );
};

export default LP;
