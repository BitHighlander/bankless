import { Grid, Button } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";

const Onramp = () => {
  const [status, setStatus] = React.useState({
    rate: "...",
    sessionId: "...",
  });
  const [sessionId, setSessionId] = React.useState(null);
  
  const clearSession = async function () {
    try {
      // eslint-disable-next-line no-console
      console.log("onDone: ");
      const status = await axios.get(
          "http://localhost:4000/api/v1/" + "status"
      );
      setStatus(status.data);
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

      window.location.reload();
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
      setStatus(status.data);
      if(status.data.sessionId){
        setStatus(status.data.sessionId);
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
      <h2>{Number(status.rate).toFixed(2)} DAI/USD | <Button colorScheme='teal' onClick={clearSession}>end session</Button> | {(1 / Number(status.rate)).toFixed(2)} USD/DAI</h2>
    </Grid>
  );
};

export default Onramp;
