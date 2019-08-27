exports.isSafePath = (path, cwd) => {
    return path.indexOf(cwd) === 0
}