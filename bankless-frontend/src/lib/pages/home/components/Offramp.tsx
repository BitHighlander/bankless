import {
  Grid,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import "../../../styles/ButtonContainer.css";

const Buy = () => {

  const onStart = async function () {
    try {

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
      <div className="button-container">
          <button className="button">$5</button>
          <button className="button">$10</button>
          <button className="button">$20</button>
          <button className="button">$50</button>
          <button className="button">$100</button>
      </div>
  );
};

export default Buy;
