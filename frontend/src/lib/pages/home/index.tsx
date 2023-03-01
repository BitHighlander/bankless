import {
  Grid,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";

import Onramp from "./components/Onramp";
import Offramp from "./components/Offramp";
import LP from "./components/LP";
import Status from "./components/Status";
import Rate from "./components/Rate";

const Home = () => {
  return (
    <Grid gap={4}>
      <Rate />
      <Tabs>
        <TabList>
          <Tab>BUY</Tab>
          <Tab>SELL</Tab>
          <Tab>LP</Tab>
          <Tab>Status</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Onramp />
          </TabPanel>
          <TabPanel>
            <Offramp />
          </TabPanel>
          <TabPanel>
            <LP />
          </TabPanel>
          <TabPanel>
            <Status />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Grid>
  );
};

export default Home;
