import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
// import { Strategy as AppleStrategy, Profile } from 'passport-apple';
import { Strategy as LocalStrategy} from 'passport-local';
import bcrypt from 'bcrypt';
import { prisma } from '../util/prisma';
import config from './config';

passport.serializeUser((user, done) => {
    done(null, user);
});
  
passport.deserializeUser((user: any, done) => {
    done(null, user);
});
  

passport.use(
    new GoogleStrategy(
        {
            clientID: config.GOOGLE_CLIENT_ID!,
            clientSecret: config.GOOGLE_CLIENT_SECRET!,
            callbackURL: "http://localhost:5000/api/v1/auth/google/callback"
        },
        async (_accessToken, _refreshToken, profile, done) => {

            try {
                console.log("hitting");
                
                let user = await prisma.user.findFirst({
                    where: {
                        googleId: profile.id
                    }
                })

                if(!user) {
                    const email = profile.emails?.[0].value;
                    const existingUser = await prisma.user.findFirst({
                        where: {email}
                    });

                    if(existingUser) {
                        user = await prisma.user.update({
                            where: {
                                id: existingUser.id
                            },
                            data: {
                                googleId: profile.id
                            }
                        })
                    } else {
                        user = await prisma.user.create({
                            data: {
                                email: email || "",
                                googleId: profile.id
                            }
                        })
                    }

                }

                const payload = {
                    userId: user.id
                }
    
                return done(null, payload);
                
                
            } catch (error) {
                console.error("Error in google authentication.", error);
                return done(error, false);
            }


            
        }
    )
)

// passport.use(
//     new FacebookStrategy(
//         {
//             clientID: process.env.FACEBOOK_CLIENT_ID!,
//             clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
//             callbackURL: "/auth/facebook/callback",
//             profileFields: ["id", "emails", "name"],
//         },
//         async (_accessToken, _refreshToken, profile, done) => {

//             try {

//                 let user = await prisma.user.findFirst({
//                 where: { facebookId: profile.id },
//                 });
        
//                 if (!user) {
//                     user = await prisma.user.create({
//                         data: {
//                         facebookId: profile.id,
//                         email: profile.emails?.[0]?.value || "",
//                         },
//                     });
//                 }
//                 return done(null, user);
                
//             } catch (error) {
//                 console.error("Error while facebook login.", error);
//                 return done(null, false);
                
//             }
//         }
//     )
// );

passport.use(
    new LocalStrategy(
        { usernameField: "email"},
        async (email, password, done) => {

            try {
                
                const user = await prisma.user.findFirst({
                    where: {
                        email
                    }
                })
                
                if(!user || !user.password) {
                    return done(null, false, {
                        message: "No user found."
                    });
                }
    
                const isMatch = await bcrypt.compare(password, user.password);
                if(!isMatch) return done(null, false, {
                    message: "Invalid Credentials."
                })

                const payload = {
                    userId: user.id
                }
    
                return done(null, payload);
                
            } catch (error) {
                console.error("Error while logging in with credentials.", error);
                return done(null, false);
            }
            

        }
    )
)