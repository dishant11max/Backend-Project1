class ApiResponse {
    constructor(statusCode,message="Success",data){
        this.statusCode=statusCode,
        this.success=statusCode,
        this.data=data,
        this.message=message
    }
}
export {ApiResponse}