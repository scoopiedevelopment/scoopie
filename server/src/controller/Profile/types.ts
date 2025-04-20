
export interface UpdateProfileBody {
    username: string,
    name: string,
    bio: string,
    dateofBirth: string,
    website :string,
    profilePic: string,
    type: string
}

export interface ToggleFollowBody {
    followingId: string, 
    followerId: string, 
    action: string 
}