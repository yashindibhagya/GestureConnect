import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';

export default function Button({ text, type = 'fill', onPress, loading }) {
  //console.log("Button text prop:", text); // Debugging log

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading} 
      style={{
        padding: 15,
        width: '80%',
        borderRadius: 30,
        backgroundColor: type === 'fill' ? '#F7B316' : '#fff',
        borderWidth: type === 'outline' ? 2 : 0,
        borderColor: '#F7B316',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator size="large" color={type === 'fill' ? '#000000' : '#000000'} />
      ) : (
        <Text
          style={{
            color: type === 'fill' ? '#fff' : '#000000',
            fontWeight: '600',
            textAlign: 'center',
            fontSize: 18,
          }}
        >
          {typeof text === 'string' ? text : JSON.stringify(text)}
        </Text>
      )}
    </TouchableOpacity>
  );
}
