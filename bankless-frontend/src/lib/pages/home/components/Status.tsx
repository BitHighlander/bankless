import { Grid } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";

const Onramp = () => {
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
    </Grid>
  );
};

export default Onramp;
