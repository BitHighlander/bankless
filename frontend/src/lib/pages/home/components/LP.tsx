import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  Avatar,
  Stack,
  Switch,
  Tabs, TabList, TabPanels, Tab, TabPanel
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";
import daiImage from 'lib/assets/dai.png';
import dollarsImage from 'lib/assets/dollars.png';

// @ts-ignore
const LP = ({ setLockTabs }) => {
  const [sessionInit, setSessionInit] = React.useState(false);
  const [isAsync, setisAsync] = React.useState(false);
  const [typeSelected, setTypeSelected] = React.useState(false);
  // const [sessionInit, setSessionInit] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const [lpAsset, setLpAsset] = React.useState("USD");
  const handleInputChangeAddress = (e: any) => setAddress(e.target.value);

  const onSubmit = async function () {
    try {
      console.log("isAsync: ", isAsync)
      if(isAsync){
        const body = {
          address,
          type:"sync"
        };
        const submitResp = await axios.post(
            "http://localhost:4000/api/v1/create/lpAddAsym",
            body
        );
        // eslint-disable-next-line no-console
        console.log("submitResp: ", submitResp);
      } else {
        const body = {
          address,
          type:"sync"
        };
        const submitResp = await axios.post(
            "http://localhost:4000/api/v1/create/lpAdd",
            body
        );
        // eslint-disable-next-line no-console
        console.log("submitResp: ", submitResp);
      }
      setSessionInit(true);
      setLockTabs(true);
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

  const onSelectType = async function (type:string) {
    try {
      console.log("selected type: ",type)
      //
      if(type === "sync"){
        setisAsync(false);
      } else {
        setisAsync(true);
      }
      setTypeSelected(true);
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

  const handleToggleChange = () => {
    setLpAsset((prevAsset) => (prevAsset === 'USD' ? 'DAI' : 'USD'));
  };

  const isError = false;

  return (
    <Grid textAlign="center" gap={2}>
      Provide LP to device.
      {sessionInit ? (
          <div>
            Session Started!
            <br/>
            type: {isAsync ? "async" : "sync"}
          </div>
      ): (
          <div>
            {typeSelected ? (
                <div>
                  LP tokens are held by your wallet. Scan your Wallets Address QR code to deposit.
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
                        onClick={onSubmit}
                    >
                      Continue
                    </Button>
                  </FormControl>
                </div>
            ) : (
                <div>
                  <br/>
                  <Button
                    onClick={() => {onSelectType("sync")}}
                  >I have BOTH USD and DAI to deposit evenly</Button>
                  <br/>
                  <Button>I have EITHER USD and DAI to deposit (swap frees apply)</Button>
                </div>
            )}
          </div>
      )}

    </Grid>
  );
};

export default LP;
