import {
  Grid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Spinner } from '@chakra-ui/react'
// @ts-ignore
import EthereumQRPlugin from "@dri/ethereum-qr-code";
import {set} from "husky";
import { QrReader } from 'react-qr-reader';
// later in code
const qr = new EthereumQRPlugin();

const socket = io("ws://127.0.0.1:4000");

const Onramp = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState(null);
  const [sessionId, setSessionId] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [txid, setTxid] = React.useState("");
  const [usd, setUsd] = React.useState(0);
  // const [sessionInit, setSessionInit] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const handleInputChangeAddress = (e: any) => setAddress(e.target.value);

  const handleError = (error) => {
    console.error(error);
  }

  const handleScan = (data) => {
    if (data) {
      console.log(data)
      console.log(data.text)
      const paymentParams = qr.readStringToJSON(data.text);
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

    socket.on("message", (message:any) => {
      console.log("message: ",message);
      onCheckDollars()
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
      const body = {
        address,
      };
      console.log("address: ",address)
      let submitResp = await axios.post(
          "http://127.0.0.1:4000/api/v1/create/buy",
          body
      );
      submitResp = submitResp.data
      // eslint-disable-next-line no-console
      console.log("submitResp: ", submitResp);

      setSessionId(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onCheckDollars = async function () {
    try {
      // eslint-disable-next-line no-console
      //get last session
      let status = await axios.get(
          "http://localhost:4000/api/v1/" + "status"
      );
      status = status.data
      console.log("status: ",status)
      // @ts-ignore
      if(status && status.session && status.session.SESSION_FUNDING_USD){
        // @ts-ignore
        setUsd(status.session.SESSION_FUNDING_USD)
        console.log("onCheckDollars: ");
      }
      if(status && status.session && status.session.txid){
        // @ts-ignore
        setTxid(status.session.txid)
        setSent(true)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onDone = async function () {
    try {
      // eslint-disable-next-line no-console
      console.log("onDone: ");
      
      //fullfill
      //
      const body = {
        address,
        sessionId
      };
      console.log("address: ",address)
      let submitResp = await axios.post(
          "http://127.0.0.1:4000/api/v1/fullfill",
          body
      );
      submitResp = submitResp.data
      // eslint-disable-next-line no-console
      console.log("submitResp: ", submitResp);

      setSending(true)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onStart = async function () {
    try {
      //get last session
      let status = await axios.get(
          "http://localhost:4000/api/v1/" + "status"
      );
      status = status.data
      console.log("status: ",status)
      // @ts-ignore
      if(status.session){
        // @ts-ignore
        setSessionId(status.session.sessionId)
      }
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
      {sessionId ? (
        <div>
          {sending ? (<div>
                {sent ? (<div>sent: txid: {txid}</div>) : (<div>
                  <Spinner />
                </div>)}
          </div>) : (<div>
            sessionId {sessionId} (awaiting deposit....)
            <div>
              <p>USD: {usd || "0"}</p>
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
          </div>)}
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
