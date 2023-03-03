import { Grid } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";

const Onramp = () => {
  const [availableOnes, setAvailableOnes] = useState(0);
  const [availableFives, setAvailableFives] = useState(0);
  const [availableTens, setAvailableTens] = useState(0);
  const [availableTwenties, setAvailableTwenties] = useState(0);
  const [availableFifties, setAvailableFifties] = useState(0);
  const [availableHundreds, setAvailableHundreds] = useState(0);
  const [status, setStatus] = React.useState({
    rate: "...",
    balanceUSD: "...",
    balanceLUSD: "...",
    billacceptor: "...",
    hotwallet: "...",
  });

  const onStart = async function () {
    try {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const status = await axios.get(
        // eslint-disable-next-line no-useless-concat
        "http://localhost:4000/api/v1/" + "status"
      );
      setStatus(status.data);

      setAvailableOnes(status.data.cash['1'])
      setAvailableFives(status.data.cash['5'])
      setAvailableTens(status.data.cash['10'])
      setAvailableTwenties(status.data.cash['20'])
      setAvailableFifties(status.data.cash['50'])
      availableHundreds(status.data.cash['100'])
      
      //total
      let totalSelected = 0;
      Object.keys(status.data.cash).forEach(key => {
        totalSelected = totalSelected + (parseInt(key) * status.data.cash[key]);
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

  return (
    <Grid textAlign="center" gap={2}>
      <small>status acceptor: {status.billacceptor}</small>
      <small>status hotwallet: {status.hotwallet}</small>
      <small>rate: {status.hotwallet}</small>
      <small>Amount USD in device: {status.balanceUSD}</small>
      <small>Amount LUSD in Wallet: {status.balanceLUSD}</small>
      <small>cash: 1: {availableOnes} 5: {availableFives} 10: {availableTens} 20: {availableTwenties} 50: {availableFifties} 100: {availableHundreds}</small>
    </Grid>
  );
};

export default Onramp;
