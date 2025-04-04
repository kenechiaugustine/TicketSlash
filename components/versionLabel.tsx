import React from "react";
import { Text, View, StyleSheet } from "react-native";

const VersionLabel = () => {
  return (
    <View>
      <Text style={styles.textDesign}>Version 1.0.0 beta</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  textDesign: {
    fontSize: 8,
  },
});

export default VersionLabel;
