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
      setAvailableHundreds(status.data.cash['100'])
      
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
    <table style={{textAlign: "left", verticalAlign: "top"}}>
      <tr><th>Bill Acceptor</th><td>{status.billacceptor}</td></tr>
      <tr><th>Hot Wallet</th><td>{status.hotwallet}</td></tr>
      <tr><th>Total USD</th><td>{status.balanceUSD}</td></tr>
      <tr><th>Total LUSD</th><td>{status.balanceLUSD}</td></tr>
      <tr><th>Rate</th><td>{status.rate} USD per LUSD</td></tr>
      <tr><th>Cash</th><td>
	<table>
		<tr><th>$1</th><th>$5</th><th>$10</th><th>$20</th><th>$50</th><th>$100</th></tr>
		<tr><td>{availableOnes}</td><td>{availableFives}</td><td>{availableTens}</td><td>{availableTwenties}</td><td>{availableFifties}</td><td>{availableHundreds}</td></tr>
	</table>
      </td></tr>
    </table>
  );
};

export default Onramp;
