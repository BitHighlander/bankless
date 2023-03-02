import {
  Grid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
} from "@chakra-ui/react";
import { QrReader } from "react-qr-reader";
import axios from "axios";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
// @ts-ignore
import EthereumQRPlugin from "ethereum-qr-code";
import {set} from "husky";

// later in code
const qr = new EthereumQRPlugin();

const socket = io();

const Onramp = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState(null);
  const [sessionInit, setSessionInit] = React.useState(false);
  // const [sessionInit, setSessionInit] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const handleInputChangeAddress = (e: any) => setAddress(e.target.value);

  const handleError = (error) => {
    console.error(error);
  }

  const handleScan = (data) => {
    if (data) {
      const paymentParams = qr.readStringToJSON(data);
      const scannedAddress = paymentParams.to;
      setAddress(scannedAddress);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("pong", () => {
      setLastPong(new Date().toISOString());
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("pong");
    };
  }, []);

  const sendPing = () => {
    socket.emit("ping");
  };

  const onSubmit = async function () {
    try {
      //
      setSessionInit(true);
      const body = {
        address,
      };

      const submitResp = await axios.post(
        "http://localhost:4000/api/v1/status",
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
      OnRamp to LUSD

      {sessionInit ? (
        <div>
          session {} (awaiting deposit....)
          <div>
            <p>Connected: {`${isConnected}`}</p>
            <p>Last pong: {lastPong || "-"}</p>
            <button onClick={sendPing}>Send ping</button>
          </div>
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
            <QrReader
                delay={300}
                onError={handleError}
                onResult={handleScan}
                style={{ width: "100%" }}></QrReader>
          </FormControl>
        </div>
      )}
    </Grid>
  );
};

export default Onramp;
