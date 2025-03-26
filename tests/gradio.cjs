//import { SpacesModule } from '../src/Engine/hugging-spaces'
const { HugSpacesChat } = require('../dist/hugging-spaces/Engine/hugging-spaces')// as SpacesModule


const client = new HugSpacesChat({ 
    apiKey: "",
    modelName: "openai/gpt-4o"
})

client.sendPrompt([ "ダンガンロンパ 希望の学園と絶望の高校生" ])
.then(response => console.log(response))