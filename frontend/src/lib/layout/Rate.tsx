import { Grid, Button } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";

const Onramp = () => {
  const [sessionId, setSessionId] = React.useState("...");
  const [rate, setRate] = React.useState("...");
  
  const clearSession = async function () {
    try {
      window.location.reload();
      // eslint-disable-next-line no-console
      console.log("onDone: ");
      const status = await axios.get(
          "http://localhost:4000/api/v1/" + "status"
      );
      setSessionId("");
      if(status.data.sessionId){
        //fullfill
        const body = {
          sessionId
        };
        let submitResp = await axios.post(
            "http://127.0.0.1:4000/api/v1/clear",
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


  const onStart = async function () {
    try {
      const status = await axios.get(
        "http://localhost:4000/api/v1/" + "status"
      );
      if(status.data.sessionId){
        setSessionId(status.data.sessionId);
      }
      if(status.data.rate){
        setRate(status.data.rate);
      }
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
      <h2>{Number(rate).toFixed(2)} USD/DAI | <Button colorScheme='teal' onClick={clearSession}>end session</Button> | {(1 / Number(rate)).toFixed(2)} DAI/USD</h2>
    </Grid>
  );
};

export default Onramp;
