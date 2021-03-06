const fs = require("fs");
const AWS = require("aws-sdk");
const glob = require("glob");

const lambda = new AWS.Lambda({ region: "us-west-2" });

const lambdaArn = fs.readFileSync("./deployed_lambda_arn").toString();

async function main() {
  const files = glob
    .sync("cypress/integration/**/*.spec.js", {
      cwd: "lambda"
    })
    .map(file => `/tmp/${file}`);

  try {
    const results = await Promise.all(
      files.map(file => {
        return lambda
          .invoke({
            FunctionName: lambdaArn,
            Payload: JSON.stringify({ cypressSpec: file })
          })
          .promise();
      })
    );

    results.forEach((result, idx) => {
      fs.writeFileSync(
        `reports/mochawesome-${idx}.json`,
        JSON.parse(result.Payload)
      );
    });
  } catch (e) {
    console.error(e);
  }
}

main();
