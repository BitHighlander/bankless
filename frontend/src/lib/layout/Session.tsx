import { Grid } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect } from "react";

const Onramp = () => {
    const [sessionId, setSessionId] = React.useState();
    const [type, setType] = React.useState();
    const [rate, setRate] = React.useState();

    const onStart = async function () {
        try {
            const status = await axios.get(
                "http://localhost:4000/api/v1/" + "status"
            );
            if(status.data.sessionId){
                setSessionId(status.data.sessionId);
            }
            if(status.data.setType){
                setType(status.data.type);
            }
            if(status.data.rate){
                setRate(status.data.rate);
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
        <Grid gap={2}>
            session: {sessionId}
            <br/>
            type: {status.type}
        </Grid>
    );
};

export default Onramp;
