import {
  Grid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Tooltip,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Spinner } from '@chakra-ui/react'
// @ts-ignore
import EthereumQRPlugin from "@dri/ethereum-qr-code";
import { QrReader } from 'react-qr-reader';
// later in code
const qr = new EthereumQRPlugin();

const socket = io("ws://127.0.0.1:4000");

// @ts-ignore
const Onramp = ({ sessionId, setLockTabs }) => {
  const [sliderValue, setSliderValue] = React.useState(5)
  const [showTooltip, setShowTooltip] = React.useState(false)
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState(null);
  const [sessionTypeSelected, setSessionTypeSelected] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [fullfilled, setFullfilled] = React.useState(false);
  const [readyForPayout, setReadyForPayout] = React.useState(false);
  const [txid, setTxid] = React.useState("");
  const [usd, setUsd] = React.useState(0);
  const [sessionInit, setSessionInit] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const handleInputChangeAddress = (e: any) => setAddress(e.target.value);

  const handleError = (error: any) => {
    console.error(error);
  }

  const handleScan = (data: { text: React.SetStateAction<string>; }) => {
    if (data) {
      console.log("data: ",data)
      console.log("data.text: ",data.text)
      //@TODO detect if payment params or addy
      // const paymentParams = qr.readStringToJSON(data.text);
      // console.log("paymentParams: ",paymentParams)
      // const scannedAddress = paymentParams.to;
      // console.log("scannedAddress: ",scannedAddress)
      const ethAddressRegex = /0x[0-9a-fA-F]{40}/; // Regular expression to match Ethereum address pattern
      // @ts-ignore
      const extractedAddress = data.text.match(ethAddressRegex)?.[0] || ""; // Extract the Ethereum address from the string
      if (extractedAddress) {
        setAddress(extractedAddress);
      }
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("address", (message:any) => {
      console.log("setAddress: ",message);
      console.log("setAddress: ",message.address);
      setAddress(message.address);
    });

    socket.on("message", (message:any) => {
      console.log("message: ",message);
      let messageObj = JSON.parse(message);
      if(messageObj.event === "address"){
        console.log("setAddress: ",messageObj.address);
        setAddress(messageObj.address);
      }
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

  const onClear = async function () {
    try {

      // @ts-ignore
      window.location.reload(true);

    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onSubmit = async function () {
    try {

      //onSubmit
      const body = {
        address,
      };
      console.log("address: ",address)

      console.log("body: ", body);
      let submitRespCreate = await axios.post(
          "http://127.0.0.1:4000/api/v1/create/buy",
          body
      );
      submitRespCreate = submitRespCreate.data
      // eslint-disable-next-line no-console
      console.log("submitRespCreate: ", submitRespCreate);
      setLockTabs(true)
      // console.log("sessionId: ", submitResp.sessionId);
      // console.log("setSessionId: ", setSessionId);
      // setSessionId(submitResp.sessionId);
      // @ts-ignore
      if(submitRespCreate.type === 'buy'){
        // @ts-ignore
        setSessionTypeSelected(true)
      }

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
        setReadyForPayout(true)
      }
      // @ts-ignore
      if(status && status.session && status.session.txid){
        // @ts-ignore
        setTxid(status.session.txid)
        setSent(true)
        setSessionTypeSelected(true)
        setTimeout(window.location.reload, 45000)
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
      const body = {
        address,
        sessionId:"test"
      };
      console.log("address: ",address)
      let submitRespFullfill = await axios.post(
          "http://127.0.0.1:4000/api/v1/fullfill",
          body
      );
      submitRespFullfill = submitRespFullfill.data
      console.log("submitRespFullfill: ", submitRespFullfill);

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
      if(status.session && status.session.type === 'buy'){
        // @ts-ignore
        setSessionId(status.session.sessionId)
        setSessionTypeSelected(true)
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

  const handleQuote = async function (v: any) {
    try {
      // eslint-disable-next-line no-console
      console.log("quote: ",v);
        //get max

      //get percent of max
      //round to nearest dollar
      //get qoute out of that

      //handleQuote

    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };


  return (
    <Grid textAlign="center" gap={2}>
      Buy DAI
      {sessionTypeSelected ? (
        <div>
          {sending ? (<div>
                {sent ? (<div>
                  sent: txid: https://etherscan.io/tx/{txid} <br/>
                  </div>) : (<div>
                  <Spinner />
                </div>)}
          </div>) : (<div>
            {readyForPayout ? (<div>
              <div>
              <p>USD: {usd || "0"}</p>
            </div> <Button
                mt={4}
                colorScheme="teal"
                // isLoading={props.isSubmitting}
                type="submit"
                onClick={onDone}
            >
              Payout Crypto
            </Button></div>):(<div>
              {/*<Slider*/}
              {/*    id='slider'*/}
              {/*    defaultValue={5}*/}
              {/*    min={0}*/}
              {/*    max={100}*/}
              {/*    colorScheme='teal'*/}
              {/*    onChange={(v) => handleQuote(v)}*/}
              {/*    onMouseEnter={() => setShowTooltip(true)}*/}
              {/*    onMouseLeave={() => setShowTooltip(false)}*/}
              {/*>*/}
              {/*  <SliderMark value={25} mt='1' ml='-2.5' fontSize='sm'>*/}
              {/*    25%*/}
              {/*  </SliderMark>*/}
              {/*  <SliderMark value={50} mt='1' ml='-2.5' fontSize='sm'>*/}
              {/*    50%*/}
              {/*  </SliderMark>*/}
              {/*  <SliderMark value={75} mt='1' ml='-2.5' fontSize='sm'>*/}
              {/*    75%*/}
              {/*  </SliderMark>*/}
              {/*  <SliderTrack>*/}
              {/*    <SliderFilledTrack />*/}
              {/*  </SliderTrack>*/}
              {/*  <Tooltip*/}
              {/*      hasArrow*/}
              {/*      bg='teal.500'*/}
              {/*      color='white'*/}
              {/*      placement='top'*/}
              {/*      isOpen={showTooltip}*/}
              {/*      label={`${sliderValue}%`}*/}
              {/*  >*/}
              {/*    <SliderThumb />*/}
              {/*  </Tooltip>*/}
              {/*</Slider>*/}
              (deposit cash....)</div>)}
          </div>)}
        </div>
      ) : (
        <div>
          <FormControl isInvalid={isError}>
            <div style={{width: "500px", margin: "auto"}}>
              <QrReader
                  delay={500}
                  onError={handleError}
                  onResult={handleScan}>
              </QrReader>
            </div>
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
                colorScheme="teal"
                // isLoading={props.isSubmitting}
                type="submit"
                size={"sm"}
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

export default Onramp;
