import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';

export default function Button({ text, type = 'fill', onPress, loading }) {
  //console.log("Button text prop:", text); // Debugging log

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        padding: 6,
        width: '70%',
        height: 35,
        borderRadius: 30,
        backgroundColor: type === 'fill' ? '#F7B316' : '#fff',
        borderWidth: type === 'outline' ? 2 : 0,
        borderColor: '#F7B316',
        alignSelf: 'center',
        justifyContent: 'center',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator size="large" color={type === 'fill' ? '#000000' : '#000000'} />
      ) : (
        <Text
          style={{
            color: type === 'fill' ? '#fff' : '#F7B316',
            fontWeight: '400',
            textAlign: 'center',
            fontSize: 14,
          }}
        >
          {typeof text === 'string' ? text : JSON.stringify(text)}
        </Text>
      )}
    </TouchableOpacity>
  );
}
