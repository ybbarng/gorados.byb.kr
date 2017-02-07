#!/bin/zsh

for i in {1..251}
do
    wget https://github.com/PokeAPI/sprites/raw/master/sprites/pokemon/$i.png
done
