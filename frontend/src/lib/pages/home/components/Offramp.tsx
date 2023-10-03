import { Button } from "@chakra-ui/react";
import "../../../styles/ButtonContainer.css";
import axios from "axios";
import QRCode from "qrcode.react";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("ws://127.0.0.1:4000");

// @ts-ignore
const Buy = ({ sessionId, setLockTabs }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [availableOnes, setAvailableOnes] = useState(0);
  const [availableFives, setAvailableFives] = useState(0);
  const [availableTens, setAvailableTens] = useState(0);
  const [availableTwenties, setAvailableTwenties] = useState(0);
  const [availableFifties, setAvailableFifties] = useState(0);
  const [availableHundreds, setAvailableHundreds] = useState(0);
  const [selectedOnes, setselectedOnes] = useState(0);
  const [selectedFives, setselectedFives] = useState(0);
  const [selectedTens, setselectedTens] = useState(0);
  const [selectedTwenties, setselectedTwenties] = useState(0);
  const [selectedFifties, setselectedFifties] = useState(0);
  const [selectedHundreds, setselectedHundreds] = useState(0);
  const [totalSelected, setTotalSelected] = useState(0);
  const [isDisabledOnes, setisDisabledOnes] = useState(false);
  const [isDisabledFives, setisDisabledFives] = useState(false);
  const [isDisabledTens, setisDisabledTens] = useState(false);
  const [isDisabledTwenties, setisDisabledTwenties] = useState(false);
  const [isDisabledFifties, setisDisabledFifties] = useState(false);
  const [isDisabledHundreds, setisDisabledHundreds] = useState(false);
  const [readyForDeposit, setReadyForDeposit] = useState(false);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
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

    socket.on("message", (message: any) => {
      console.log("message: ", message);
      onCheckDollars();
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
      let status = await axios.get("http://localhost:4000/api/v1/" + "status");
      status = status.data;
      console.log("status: ", status);
      // @ts-ignore
      if (status && status.session && status.session.SESSION_FUNDING_DAI) {
        // @ts-ignore
        setUsd(status.session.SESSION_FUNDING_DAI);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onSubmit = async function () {
    try {
      tallySelected();

      if (totalSelected === 0) {
        alert("Please select at least one bill");
        return;
      }
      setLockTabs(true);
      const body = {
        amount: totalSelected.toString(),
      };
      console.log("body: ", body);
      const submitResp = (
        await axios.post("http://127.0.0.1:4000/api/v1/create/sell", body)
      ).data;
      setReadyForDeposit(true);
      setAddress(submitResp.address);
      setAmountIn(submitResp.amountIn);
      setAmountOut(submitResp.amountOut);

      const newQrString = submitResp.address.toString();
      setQrString(newQrString);
      // eslint-disable-next-line no-console
      console.log("submitResp: ", submitResp);

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
      setReadyForDeposit(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onStart = async function () {
    try {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const status = await axios.get(
        // eslint-disable-next-line no-useless-concat
        "http://localhost:4000/api/v1/" + "status"
      );
      // setStatus(status.data);
      setAvailableOnes(status.data.cash["1"]);
      setAvailableFives(status.data.cash["5"]);
      setAvailableTens(status.data.cash["10"]);
      setAvailableTwenties(status.data.cash["20"]);
      setAvailableFifties(status.data.cash["50"]);
      setAvailableHundreds(status.data.cash["100"]);
      if (status.data.cash["1"] === 0) setisDisabledOnes(true);
      if (status.data.cash["5"] === 0) setisDisabledFives(true);
      if (status.data.cash["10"] === 0) setisDisabledTens(true);
      if (status.data.cash["20"] === 0) setisDisabledTwenties(true);
      if (status.data.cash["50"] === 0) setisDisabledFifties(true);
      if (status.data.cash["100"] === 0) setisDisabledHundreds(true);

      // total
      let totalSelected = 0;
      Object.keys(status.data.cash).forEach((key) => {
        totalSelected += parseInt(key) * status.data.cash[key];
      });

      // eslint-disable-next-line no-console
      console.log("status: ", status.data);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  // onstart get data
  useEffect(() => {
    onStart();
  }, []);

  const onClickOnes = async function () {
    try {
      const selectedOnesNew = selectedOnes + 1;
      const availableOnesNew = availableOnes - 1;
      if (availableOnesNew == 0) setisDisabledOnes(true);
      setselectedOnes(selectedOnesNew);
      setAvailableOnes(availableOnesNew);
      tallySelected();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onClickFives = async function () {
    try {
      const selectedFivesNew = selectedFives + 1;
      const availableFivesNew = availableFives - 1;
      if (availableFivesNew == 0) setisDisabledFives(true);
      setselectedFives(selectedFivesNew);
      setAvailableFives(availableFivesNew);
      tallySelected();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onClickTens = async function () {
    try {
      const selectedTensNew = selectedTens + 1;
      const availableTensNew = availableTens - 1;
      if (availableTensNew == 0) setisDisabledTens(true);
      setselectedTens(selectedTensNew);
      setAvailableTens(availableTensNew);
      tallySelected();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onClickTwenties = async function () {
    try {
      const selectedTwentiesNew = selectedTwenties + 1;
      const availableTwentiesNew = availableTwenties - 1;
      if (availableTwentiesNew == 0) setisDisabledTwenties(true);
      setselectedTwenties(selectedTwentiesNew);
      setAvailableTwenties(availableTwentiesNew);
      tallySelected();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onClickFifties = async function () {
    try {
      const selectedFiftiesNew = selectedFifties + 1;
      const availableFiftiesNew = availableFifties - 1;
      if (availableFifties == 0) setisDisabledFifties(true);
      setselectedFifties(selectedFiftiesNew);
      setAvailableFifties(availableFiftiesNew);
      tallySelected();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onClickHundreds = async function () {
    try {
      const selectedHundredsNew = selectedHundreds + 1;
      const availableHundredsNew = availableHundreds - 1;
      if (availableHundredsNew == 0) setisDisabledHundreds(true);
      setselectedHundreds(selectedHundredsNew);
      setAvailableHundreds(availableHundredsNew);
      tallySelected();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onSubmitWithdrawal = async function () {
    try {
      const body = {
        address,
        sessionId,
      };
      console.log("address: ", address);
      let submitResp = await axios.post(
        "http://127.0.0.1:4000/api/v1/fullfill",
        body
      );

      submitResp = submitResp.data;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const tallySelected = async function () {
    try {
      // go to API get this data
      const allBills = {
        "1": selectedOnes,
        "5": selectedFives,
        "10": selectedTens,
        "20": selectedTwenties,
        "50": selectedFifties,
        "100": selectedHundreds,
      };
      let totalSelected = 0;
      Object.keys(allBills).forEach((key) => {
        // @ts-ignore
        totalSelected += key * allBills[key];
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
  }, [
    totalSelected,
    onClickOnes,
    onClickHundreds,
    onClickFifties,
    onClickFives,
    onClickTens,
    onClickTwenties,
  ]);

  return (
    <div>
      {readyForDeposit ? (
        <div>
          <table style={{ textAlign: "left" }}>
            <tr>
              <th>Address</th>
              <td>{address}</td>
            </tr>
            <tr>
              <th>SessionId</th>
              <td>{sessionId}</td>
            </tr>
            <tr>
              <th>Cash to be purchased</th>
              <td>${Number(amountOut).toFixed(2)}</td>
            </tr>
            <tr>
              <th>DAI to deposit</th>
              <td>{(Math.ceil(Number(amountIn) * 100) / 100).toFixed(2)}</td>
            </tr>
          </table>
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
          <Button onClick={onSubmitWithdrawal}>Payout Cash</Button>
        </div>
      ) : (
        <div>
          <table style={{ textAlign: "center" }}>
            <tr>
              <th />
              <td>
                <button
                  onClick={onClickOnes}
                  className="button"
                  disabled={isDisabledOnes}
                >
                  $1
                </button>
              </td>
              <td>
                <button
                  onClick={onClickFives}
                  className="button"
                  disabled={isDisabledFives}
                >
                  $5
                </button>
              </td>
              <td>
                <button
                  onClick={onClickTens}
                  className="button"
                  disabled={isDisabledTens}
                >
                  $10
                </button>
              </td>
              <td>
                <button
                  onClick={onClickTwenties}
                  className="button"
                  disabled={isDisabledTwenties}
                >
                  $20
                </button>
              </td>
              <td>
                <button
                  onClick={onClickFifties}
                  className="button"
                  disabled={isDisabledFifties}
                >
                  $50
                </button>
              </td>
              <td>
                <button
                  onClick={onClickHundreds}
                  className="button"
                  disabled={isDisabledHundreds}
                >
                  $100
                </button>
              </td>
            </tr>
            <tr>
              <th>Available</th>
              <td>{availableOnes}</td>
              <td>{availableFives}</td>
              <td>{availableTens}</td>
              <td>{availableTwenties}</td>
              <td>{availableFifties}</td>
              <td>{availableHundreds}</td>
            </tr>
            <tr>
              <th>Selected</th>
              <td>{selectedOnes}</td>
              <td>{selectedFives}</td>
              <td>{selectedTens}</td>
              <td>{selectedTwenties}</td>
              <td>{selectedFifties}</td>
              <td>{selectedHundreds}</td>
            </tr>
          </table>
          <Button
            mt={4}
            colorScheme="teal"
            // isLoading={props.isSubmitting}
            type="submit"
            onClick={onSubmit}
          >
            Withdrawal
          </Button>
        </div>
      )}
    </div>
  );
};

export default Buy;
