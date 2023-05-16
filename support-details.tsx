import { MdEmail as EmailIcon, MdPhone as PhoneIcon } from 'react-icons/md'
import {
  Stack,
  Heading,
  Label,
  Text,
  Grid,
  Box,
  Flex,
  Avatar,
  Skeleton,
  LabelSkeleton
} from '@sanity/ui'
import { AirtableClientData } from './types'

import s from './styles.module.css'

interface Props {
  data: Pick<
    AirtableClientData,
    'supportTeam' | 'slackSupport' | 'emailSupport' | 'phoneSupport'
  >
  isDataLoading: boolean
}

const CardSkeleton = () => {
  return (
    <Flex justify="flex-start" align="center" padding={2}>
      <Skeleton padding={4} radius={2} animated />
      <Stack flex={1} space={2} marginLeft={4}>
        <LabelSkeleton radius={1} animated style={{ width: '100px' }} />
        <LabelSkeleton radius={1} animated style={{ width: '80px' }} />
      </Stack>
    </Flex>
  )
}

export const SupportDetails = ({ data, isDataLoading }: Props) => {
  const { supportTeam, slackSupport, emailSupport, phoneSupport } = data

  return (
    <Box
      paddingX={[2, 2, 2, 5]}
      style={{
        backgroundColor: '#fff',
        color: '#101112'
      }}
    >
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Grid columns={[1, 1, 1, 2]} gap={0}>
          <Stack
            className={s.supportChannels}
            space={[5, 5, 5, 6]}
            paddingX={[4, 4, 4, 6]}
            paddingY={6}
          >
            {isDataLoading ? (
              <>
                <LabelSkeleton radius={1} animated style={{ width: '60%' }} />
                <LabelSkeleton radius={1} animated style={{ width: '70%' }} />
                <Stack space={[4, 4, 4, 5]}>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </Stack>
              </>
            ) : (
              <>
                <Heading size={[2, 2, 2, 4]} style={{ color: '#101112' }}>
                  Support Channels
                </Heading>
                <Text
                  size={[2, 2, 2, 3]}
                  weight="semibold"
                  style={{ color: '#3F434A' }}
                >
                  Visit one of these channels to get in touch.
                </Text>
                <Stack space={[4, 4, 4, 5]}>
                  {slackSupport && (
                    <Flex align="center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 53 53"
                        style={{
                          width: '52px',
                          height: '52px',
                          marginRight: '1.25rem',
                          borderRadius: '10px',
                          backgroundColor: '#3F0F3F',
                          boxShadow:
                            '0px 1px 18px rgba(134, 144, 160, 0.12), 0px 6px 10px rgba(134, 144, 160, 0.14), 0px 3px 5px -1px rgba(134, 144, 160, 0.2), 0px 0px 0px 0.4px rgba(134, 144, 160, 0.1)'
                        }}
                      >
                        <path
                          fill="#E01E5A"
                          d="M17.334 31.625c0-2.114 1.752-3.815 3.928-3.815 2.177 0 3.929 1.701 3.929 3.815v9.393c0 2.114-1.752 3.815-3.929 3.815-2.176 0-3.928-1.701-3.928-3.815v-9.393Z"
                        />
                        <path
                          fill="#ECB22D"
                          d="M31.625 35.667c-2.114 0-3.815-1.752-3.815-3.929 0-2.176 1.701-3.928 3.815-3.928h9.393c2.114 0 3.815 1.752 3.815 3.928 0 2.177-1.701 3.929-3.815 3.929h-9.393Z"
                        />
                        <path
                          fill="#2FB67C"
                          d="M27.81 11.983c0-2.114 1.752-3.816 3.928-3.816 2.177 0 3.929 1.702 3.929 3.816v9.392c0 2.114-1.752 3.816-3.929 3.816-2.176 0-3.928-1.702-3.928-3.816v-9.392Z"
                        />
                        <path
                          fill="#36C5F1"
                          d="M11.982 25.19c-2.114 0-3.816-1.752-3.816-3.928 0-2.177 1.702-3.929 3.816-3.929h9.393c2.114 0 3.815 1.752 3.815 3.929 0 2.176-1.701 3.928-3.815 3.928h-9.393Z"
                        />
                        <path
                          fill="#ECB22D"
                          d="M27.81 40.905a3.92 3.92 0 0 0 3.928 3.929 3.92 3.92 0 0 0 3.929-3.929 3.92 3.92 0 0 0-3.929-3.928H27.81v3.928Z"
                        />
                        <path
                          fill="#2FB67C"
                          d="M40.905 25.19h-3.928v-3.928a3.92 3.92 0 0 1 3.928-3.929 3.92 3.92 0 0 1 3.929 3.929 3.92 3.92 0 0 1-3.929 3.928Z"
                        />
                        <path
                          fill="#E01E5A"
                          d="M12.095 27.81h3.929v3.928a3.92 3.92 0 0 1-3.929 3.929 3.92 3.92 0 0 1-3.929-3.929 3.92 3.92 0 0 1 3.93-3.928Z"
                        />
                        <path
                          fill="#36C5F1"
                          d="M25.19 12.096v3.928h-3.928a3.92 3.92 0 0 1-3.928-3.928 3.92 3.92 0 0 1 3.928-3.929 3.92 3.92 0 0 1 3.929 3.929Z"
                        />
                      </svg>
                      <Stack space={3}>
                        <Label size={3} style={{ color: '#101112' }}>
                          Slack Support
                        </Label>
                        <Text
                          size={1}
                          weight="regular"
                          style={{ color: '#6E7683' }}
                        >
                          {slackSupport}
                        </Text>
                      </Stack>
                    </Flex>
                  )}
                  {emailSupport && (
                    <a
                      href={`mailto:${emailSupport}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      <Flex
                        justify="center"
                        align="center"
                        style={{
                          width: '52px',
                          height: '52px',
                          marginRight: '1.25rem',
                          borderRadius: '10px',
                          color: '#fff',
                          backgroundColor: '#2F80ED',
                          boxShadow:
                            '0px 1px 18px rgba(134, 144, 160, 0.12), 0px 6px 10px rgba(134, 144, 160, 0.14), 0px 3px 5px -1px rgba(134, 144, 160, 0.2), 0px 0px 0px 0.4px rgba(134, 144, 160, 0.1)'
                        }}
                      >
                        <EmailIcon
                          style={{
                            width: '80%',
                            height: '80%'
                          }}
                        />
                      </Flex>
                      <Stack space={3}>
                        <Label size={3} style={{ color: '#101112' }}>
                          Email Support
                        </Label>
                        <Text
                          size={1}
                          weight="regular"
                          style={{ color: '#6E7683' }}
                        >
                          {emailSupport}
                        </Text>
                      </Stack>
                    </a>
                  )}
                  {phoneSupport && (
                    <a
                      href={`tel:${phoneSupport}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      <Flex
                        justify="center"
                        align="center"
                        style={{
                          width: '52px',
                          height: '52px',
                          marginRight: '1.25rem',
                          borderRadius: '10px',
                          color: '#fff',
                          backgroundColor: '#27AE60',
                          boxShadow:
                            '0px 1px 18px rgba(134, 144, 160, 0.12), 0px 6px 10px rgba(134, 144, 160, 0.14), 0px 3px 5px -1px rgba(134, 144, 160, 0.2), 0px 0px 0px 0.4px rgba(134, 144, 160, 0.1)'
                        }}
                      >
                        <PhoneIcon
                          style={{
                            width: '80%',
                            height: '80%'
                          }}
                        />
                      </Flex>
                      <Stack space={3}>
                        <Label size={3} style={{ color: '#101112' }}>
                          Phone Support
                        </Label>
                        <Text
                          size={1}
                          weight="regular"
                          style={{ color: '#6E7683' }}
                        >
                          {phoneSupport}
                        </Text>
                      </Stack>
                    </a>
                  )}
                </Stack>
              </>
            )}
          </Stack>
          <Stack
            className={s.supportTeam}
            space={[6, 6, 6, 7]}
            paddingY={6}
            paddingLeft={[4, 4, 4, 7]}
            paddingRight={[4, 4, 4, 5]}
          >
            {isDataLoading ? (
              <>
                <LabelSkeleton radius={1} animated />
                <Stack space={[5, 5, 5, 6]}>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </Stack>
              </>
            ) : (
              <>
                <Heading size={[2, 2, 2, 4]} style={{ color: '#101112' }}>
                  <Flex align="center">Your Support Team</Flex>
                </Heading>
                {supportTeam?.length > 0 && (
                  <Stack space={5}>
                    {supportTeam.map(
                      ({ name, email, roles, colour, profileImage }) => {
                        return (
                          <a
                            key={name}
                            href={email ? `mailto:${email}` : '#'}
                            style={{ textDecoration: 'none' }}
                          >
                            <Flex align="center">
                              <Box marginRight={4}>
                                <Avatar
                                  color={colour}
                                  src={profileImage}
                                  size={2}
                                />
                              </Box>
                              <Stack space={3}>
                                <Text
                                  size={[2, 2, 2, 3]}
                                  weight="semibold"
                                  style={{ color: '#101112' }}
                                >
                                  {name}
                                </Text>
                                {roles.length > 0 && (
                                  <Text
                                    size={[2, 2, 2, 3]}
                                    weight="regular"
                                    style={{ color: '#565D67' }}
                                  >
                                    <Flex>
                                      {roles.map((role) => role).join(' / ')}
                                    </Flex>
                                  </Text>
                                )}
                              </Stack>
                            </Flex>
                          </a>
                        )
                      }
                    )}
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </Grid>
      </Box>
    </Box>
  )
}

export default SupportDetails
