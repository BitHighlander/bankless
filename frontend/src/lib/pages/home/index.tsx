import {
  Grid,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Button,
  Image,
    Avatar,
    Flex
} from "@chakra-ui/react";
//images
import daiImage from 'lib/assets/dai.png';
import dollarsImage from 'lib/assets/dollars.png';

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
  const [started, setIsStarted] = useState(false);
  const [lockTabs, setLockTabs] = useState(false);
  const [sessionId, setSessionId] = useState(false);

  const startSession = async function () {
    try {
        setIsStarted(true);
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
      {started ? (<div>
          {/*<Session />*/}
          <Flex justifyContent="center" alignItems="center">
        <Tabs size='lg' variant='solid-rounded'>
          <TabList>
              <Tab isDisabled={lockTabs}>Buy Crypto
                  <Avatar src={daiImage} name="DAI" size="sm" mr={2} />
              </Tab>
              <Tab isDisabled={lockTabs}>Withdraw Cash
                  <Avatar src={dollarsImage} name="Dollars" size="sm" mr={2} />
              </Tab>
              {/*<Tab isDisabled={lockTabs}>LP</Tab>*/}
              {/*<Tab isDisabled={lockTabs}>Status</Tab>*/}
          </TabList>

          <TabPanels>
              <TabPanel>
                  <Onramp sessionId={sessionId} setLockTabs={setLockTabs} />
              </TabPanel>
              <TabPanel>
                  <Offramp sessionId={sessionId} setLockTabs={setLockTabs} />
              </TabPanel>
              {/*<TabPanel>*/}
              {/*    <LP setLockTabs={setLockTabs} />*/}
              {/*</TabPanel>*/}
              {/*<TabPanel>*/}
              {/*    <Status />*/}
              {/*</TabPanel>*/}
          </TabPanels>
        </Tabs>
          </Flex>
      </div>) : (
          <Flex justifyContent="center" alignItems="center">
              <Button colorScheme='green' size='lg' alignSelf="center" onClick={startSession}>Start</Button>
          </Flex>
      )}
      {/*<Button onClick={() => setShowStats(!showStats)}>show stats</Button>*/}
      {/*{showStats ? (<div><Status /></div>) : null}*/}
    </Grid>
  );
};

export default Home;
