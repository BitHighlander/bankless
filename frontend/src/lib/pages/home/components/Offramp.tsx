import {
  Grid,
  Box,
    Button
} from "@chakra-ui/react";
import "../../../styles/ButtonContainer.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import EthereumQRPlugin from "@dri/ethereum-qr-code";
// later in code
const qr = new EthereumQRPlugin();
import QRCode from 'qrcode.react';


const socket = io("ws://127.0.0.1:4000");

const Buy = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [availableFives, setAvailableFives] = useState(0);
  const [sessionId, setSessionId] = React.useState(false);
  const [availableTens, setAvailableTens] = useState(0);
  const [availableTwenties, setAvailableTwenties] = useState(0);
  const [availableFifties, setAvailableFifties] = useState(0);
  const [availableHundreds, setAvailableHundreds] = useState(0);
  const [selectedFives, setselectedFives] = useState(0);
  const [selectedTens, setselectedTens] = useState(0);
  const [selectedTwenties, setselectedTwenties] = useState(0);
  const [selectedFifties, setselectedFifties] = useState(0);
  const [selectedHundreds, setselectedHundreds] = useState(0);
  const [totalSelected, setTotalSelected] = useState(0);
  const [readyForDeposit, setReadyForDeposit] = useState(false);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [qrcode, setQrcode] = useState({});
  const [usd, setUsd] = useState("");
  const [qrString, setQrString] = useState("");


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


    const onCheckDollars = async function () {
        try {
            // eslint-disable-next-line no-console
            console.log("onCheckDollars: ");
            let status = await axios.get(
                "http://localhost:4000/api/v1/" + "status"
            );
            status = status.data
            console.log("status: ",status)
            // @ts-ignore
            if(status && status.session && status.session.SESSION_FUNDING_LUSD){
                // @ts-ignore
                setUsd(status.session.SESSION_FUNDING_LUSD)

                //fullfill
                const body = {
                    amount:status.session.SESSION_FUNDING_LUSD,
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
            }

        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };
    
  const tallySelected = async function () {
    try {
        //go to API get this data
        let allBills = {
            "5": selectedFives,
            "10":  selectedTens,
            "20":  selectedTwenties,
            "50":  selectedFifties,
            "100":  selectedHundreds
        }

        let totalSelected = 0;
        Object.keys(allBills).forEach(key => {
            totalSelected = totalSelected + (key * allBills[key]);
        });
        setTotalSelected(totalSelected);

    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };
    // onstart get data
    useEffect(() => {
        tallySelected();
    }, [totalSelected]);


    const onSubmit = async function () {
        try {
            tallySelected()

            if(totalSelected === 0){
                alert("Please select at least one bill");
                return;
            } else {
                const body = {
                    amount: totalSelected.toString(),
                };
                console.log("body: ", body);
                let submitResp = await axios.post(
                    "http://127.0.0.1:4000/api/v1/create/sell",
                    body
                );
                submitResp = submitResp.data
                setSessionId(submitResp.sessionId)
                setReadyForDeposit(true)
                setAddress(submitResp.address)
                setAmount(submitResp.amount)

                const newQrString = submitResp.address.toString();
                setQrString(newQrString);
                // eslint-disable-next-line no-console
                console.log("submitResp: ", submitResp);
            }
            //

            
            // let address = await axios.get(
            //     "http://localhost:4000/api/v1/" + "Address"
            // );
            // address = address.data
            // console.log("address: ",address)
            // setAddress(address)
            //
            // //make payment string
            // const paymentParams = {
            //     to:address,
            //     amount:totalSelected,
            //     gas: 21000,
            // }
            // const qrCode = qr.toCanvas(paymentParams, {
            //     selector: '#my-qr-code',
            // })
            // setQrcode(qrCode)
            setReadyForDeposit(true)
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };

    const onStart = async function () {
        try {
            
            
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };
    
  // onstart get data
  useEffect(() => {
    onStart();
  }, []);

    const onClickFives = async function () {
        try {
            let selectedFivesNew = selectedFives + 1;
            setselectedFives(selectedFivesNew)
            tallySelected()
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };

    const onClickTens = async function () {
        try {
            let selectedTensNew = selectedTens + 1;
            setselectedTens(selectedTensNew)
            tallySelected()
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };

    const onClickTwenties = async function () {
        try {
            let selectedTwentiesNew = selectedTwenties + 1;
            setselectedTwenties(selectedTwentiesNew)
            tallySelected()
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };

    const onClickFifties = async function () {
        try {
            let selectedFiftiesNew = selectedFifties + 1;
            setselectedFifties(selectedFiftiesNew)
            tallySelected()
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };

    const onClickHundreds = async function () {
        try {
            let selectedHundredsNew = selectedHundreds + 1;
            setselectedHundreds(selectedHundredsNew)
            tallySelected()
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };

    const onSubmitWithdrawal = async function () {
        try {
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
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    };
    
  return (
      <div>
          {readyForDeposit ? (<div>
              <br/>
              address: {address}
              <br/>
              amount: {amount}
              <br/>
              usd: {usd}
              <br/>
              sessionId: {sessionId}
              <br/>
              {/*{qrcode}*/}
              <Button
                  mt={4}
                  colorScheme='teal'
                  //isLoading={props.isSubmitting}
                  type='submit'
                  onClick={onSubmitWithdrawal}
              >
                  Dump Bills
              </Button>
              <div
                  style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "10px",
                  }}
              >
                  <div
                      style={{
                          border: "5px solid white",
                          padding: "5px",
                      }}
                  >
                      <QRCode value={qrString} size={300} />
                  </div>
              </div>
          </div>) : (<div style={{ paddingTop: '50px' }} className="button-container">
              <Box maxW='sm' borderWidth='1px' borderRadius='lg' overflow='hidden' m={2}>
                  <button onClick={onClickFives} className="button">$5</button> <span className="small-text">available: {availableFives} selected {selectedFives}</span>
              </Box>
              <Box maxW='sm' borderWidth='1px' borderRadius='lg' overflow='hidden' m={2}>
                  <button onClick={onClickTens} className="button">$10</button> <span className="small-text">available: {availableTens} selected {selectedTens}</span>
              </Box>
              <Box maxW='sm' borderWidth='1px' borderRadius='lg' overflow='hidden' m={2}>
                  <button onClick={onClickTwenties} className="button">$20</button> <span className="small-text">available: {availableTwenties} selected {selectedTwenties}</span>
              </Box>
              <Box maxW='sm' borderWidth='1px' borderRadius='lg' overflow='hidden' m={2}>
                  <button onClick={onClickFifties} className="button">$50</button> <span className="small-text">available: {availableFifties} selected {selectedFifties}</span>
              </Box>
              <Box maxW='sm' borderWidth='1px' borderRadius='lg' overflow='hidden' m={2}>
                  <button onClick={onClickHundreds} className="button">$100</button> <span className="small-text">available: {availableHundreds} selected {selectedHundreds}</span>
              </Box>
              <div className="total-container">
                  <p>Total amount selected: ${totalSelected}</p>
              </div>
              <Button
                  mt={4}
                  colorScheme='teal'
                  //isLoading={props.isSubmitting}
                  type='submit'
                  onClick={onSubmit}
              >
                  Deposit
              </Button>
          </div>)}
      </div>
  );
};

export default Buy;
