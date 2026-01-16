import Hello,{HelloWorld} from "@/components/Sample"

function HelloPage(){
    return(
        <div>
            <h1>Hello</h1>
            <Hello />
            <HelloWorld />
        </div>
    )
}
export default HelloPage;