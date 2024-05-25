#!/usr/bin/env bash

set -e

updatedDir=$1
targetDir=$2

[ "$updatedDir" == "$targetDir" ] && echo "arguments error" && exit 1

copyRootPaths=(
    "${updatedDir}.editorconfig"
    "${updatedDir}.gitignore"
    "${updatedDir}.nvmrc"
    "${updatedDir}.prettierrc.json"
    "${updatedDir}cucumber.cjs"
    "${updatedDir}tsconfig.json"
    "${updatedDir}config.yaml"
    "${updatedDir}hardhat.config.ts"
    "${updatedDir}shared/config"
    "${updatedDir}shared/update"
)

forceCopyPairs=(
    "${updatedDir}libs/workspace" "${targetDir}libs/"
)

rsync -av "${copyRootPaths[@]}" "$targetDir"

index=0; while [ $index -lt ${#forceCopyPairs[@]} ]; do
    rsync --del -av "${forceCopyPairs[$index]}" "${forceCopyPairs[$index + 1]}"
    index=$((index + 2))
done
