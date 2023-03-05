import {
  Grid,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Button
} from "@chakra-ui/react";

import Onramp from "./components/Onramp";
import Offramp from "./components/Offramp";
import LP from "./components/LP";
import Status from "./components/Status";
import Rate from "./components/Rate";
import Session from "./components/Session";
import React, { useEffect, useState } from "react";
import axios from "axios";

const Home = () => {
  const [showStats, setShowStats] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const startSession = async function () {
    try {
        console.log("startSession: ")
        const startResp = await axios.post(
            "http://localhost:4000/api/v1/create"
        );
        // eslint-disable-next-line no-console
        console.log("startResp: ", startResp);
        setSessionId(startResp.data.sessionId);
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

  return (
    <Grid gap={4} >
      {sessionId ? (<div>
          {/*<Session />*/}
        <Tabs size='lg' variant='solid-rounded'>
          <TabList>
            <Tab>Onramp</Tab>
            <Tab>Offramp</Tab>
            {/*<Tab>LP</Tab>*/}
            <Tab>Status</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Onramp />
            </TabPanel>
            <TabPanel>
              <Offramp />
            </TabPanel>
            {/*<TabPanel>*/}
            {/*  <LP />*/}
            {/*</TabPanel>*/}
            <TabPanel>
              <Status />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>) : (
          <div>
        <Button alignSelf="center" onClick={startSession}>Start</Button>
      </div>
      )}
      {/*<Button onClick={() => setShowStats(!showStats)}>show stats</Button>*/}
      {/*{showStats ? (<div><Status /></div>) : null}*/}
    </Grid>
  );
};

export default Home;
