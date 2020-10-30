class someClass {
  async someFunction() {
    try {
      return {}
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports.someClass = someClass;